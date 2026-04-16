from langchain_core.rate_limiters import InMemoryRateLimiter

DEFAULT_REQUESTS_PER_SECOND = 0.4


def create_rate_limiter(requests_per_second: float | None = None) -> InMemoryRateLimiter:
    return InMemoryRateLimiter(
        requests_per_second=requests_per_second or DEFAULT_REQUESTS_PER_SECOND,
    )