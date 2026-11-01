"""Storage and API boundary tests, with isolated draft fixtures."""
import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.request
import urllib.error

spec = importlib.util.spec_from_file_location('draft_review', Path(__file__).parents[1] / 'scripts/draft-review.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'content').mkdir()
        self.draft = self.root / 'content/test.md'
        self.draft.write_text('---\ntitle: Test\ndraft: true\n---\n\nA paragraph.\n')
        self.store = review.ReviewStore(self.root, self.root / 'notes')
        self.anchor = dict(kind='text', quote='paragraph', block='A paragraph.', start=2, end=11, prefix='A ', suffix='.', heading='Test', index=0)

    def tearDown(self):
        self.temp.cleanup()

    def add(self):
        return self.store.change('test.md', 0, 'add', dict(anchor=self.anchor, comment='Explain this'), self.store.source('test.md'))

    def test_roundtrip_and_resolve(self):
        saved = self.add()
        result = self.store.change('test.md', 1, 'update', dict(id=saved['annotations'][0]['id'], status='resolved', resolution='Added explanation'))
        self.assertEqual(result, self.store.read('test.md'))
        self.assertEqual(result['annotations'][0]['anchor'], self.anchor)
        self.assertEqual(result['annotations'][0]['resolution'], 'Added explanation')

    def test_concurrent_writer_rejected(self):
        self.add()
        with self.assertRaises(FileExistsError):
            self.store.change('test.md', 0, 'add', dict(anchor=self.anchor, comment='Other window'))

    def test_changed_source_preserves_quote_and_blocks_stale_add(self):
        saved = self.add()
        old = saved['sourceRevision']
        self.draft.write_text(self.draft.read_text() + '\nNew content\n')
        new = self.store.read('test.md')
        self.assertNotEqual(old, new['sourceRevision'])
        self.assertEqual(new['annotations'][0]['sourceRevision'], old)
        with self.assertRaises(FileExistsError):
            self.store.change('test.md', 1, 'add', dict(anchor=self.anchor, comment='Stale'), old)

    def test_traversal_and_symlinks_denied(self):
        outside = self.root / 'private.md'
        outside.write_text('---\ndraft: true\n---\n')
        (self.root / 'content/link.md').symlink_to(outside)
        for path in ('../private.md', str(outside), 'link.md', 'a/../../private.md'):
            with self.assertRaises(ValueError):
                self.store.read(path)

    def test_published_and_invalid_anchor_denied(self):
        self.anchor['quote'] = 'wrong text'
        with self.assertRaises(ValueError):
            self.add()
        self.draft.write_text('---\ndraft: false\n---\n')
        with self.assertRaises(ValueError):
            self.store.read('test.md')

    def test_script_is_inert_data(self):
        value = '<script>window.bad=true</script>'
        saved = self.store.change('test.md', 0, 'add', dict(anchor=self.anchor, comment=value))
        self.assertEqual(saved['annotations'][0]['comment'], value)

    def test_browser_utf16_positions(self):
        self.anchor.update(block='🙂 paragraph.', quote='paragraph', start=3, end=12, prefix='🙂 ')
        self.assertEqual(self.add()['annotations'][0]['anchor']['quote'], 'paragraph')

    def test_launcher_output_and_source_cannot_be_overridden(self):
        for args in (['-d', 'public'], ['-dpublic'], ['-selsewhere'], ['-bhttps://example.com'], ['-p8080'], ['--destination=public'], ['--config=other.toml'], ['--contentDir=elsewhere'], ['--cleanDestinationDir']):
            with self.subTest(args=args), self.assertRaises(ValueError):
                review.validate_hugo_args(args)

    def test_launcher_theme_options(self):
        self.assertEqual(review.validate_hugo_args(['--themesDir', '..', '--theme=vishine', '--disableLiveReload']), ['--themesDir', '..', '--theme', 'vishine', '--disableLiveReload'])

    def test_draft_flag_must_be_top_level_and_unambiguous(self):
        self.assertFalse(review.is_draft('+++\ntitle="Public"\n[params]\ndraft=true\n+++\n'))
        self.assertFalse(review.is_draft('---\ndraft: true\ndraft: false\n---\n'))
        self.assertTrue(review.is_draft('+++\ndraft=true\n[params]\nother=true\n+++\n'))

    def test_unknown_fields_and_status_denied(self):
        payload = dict(anchor=self.anchor, comment='Note', filename='/tmp/anything')
        with self.assertRaises(ValueError):
            self.store.change('test.md', 0, 'add', payload)
        saved = self.add()
        with self.assertRaises(ValueError):
            self.store.change('test.md', 1, 'update', dict(id=saved['annotations'][0]['id'], status='unknown'))

    def test_http_session_boundary(self):
        server = review.ThreadingHTTPServer(('127.0.0.1', 0), review.handler(self.store, 'test-token', {'http://localhost:1316'}))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f'http://127.0.0.1:{server.server_port}/reviews?article=test.md'
        try:
            for headers in ({}, {'Origin': 'https://evil.example', 'X-Draft-Review': 'test-token'}, {'Origin': 'http://localhost:1316', 'X-Draft-Review': 'wrong'}):
                with self.assertRaises(urllib.error.HTTPError) as error:
                    urllib.request.urlopen(urllib.request.Request(url, headers=headers))
                self.assertEqual(error.exception.code, 403)
            with urllib.request.urlopen(urllib.request.Request(url, headers={'Origin': 'http://localhost:1316', 'X-Draft-Review': 'test-token'})) as response:
                self.assertEqual(json.load(response)['annotations'], [])
                self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'http://localhost:1316')
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    unittest.main()
