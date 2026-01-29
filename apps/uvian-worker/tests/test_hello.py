"""Hello unit test module."""

from apps/uvian_worker.hello import hello


def test_hello():
    """Test the hello function."""
    assert hello() == "Hello apps/uvian-worker"
