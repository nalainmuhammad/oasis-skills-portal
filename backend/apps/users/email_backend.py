import socket
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend


class IPv4EmailBackend(DjangoEmailBackend):
    """
    Custom SMTP EmailBackend that forces IPv4 (AF_INET) resolution.
    Fixes [Errno 101] Network is unreachable on cloud hosts like Render
    where DNS resolves IPv6 addresses that the host network cannot route.
    """
    def open(self):
        if self.connection:
            return False

        original_getaddrinfo = socket.getaddrinfo

        def ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
            # Force IPv4 (socket.AF_INET) resolution
            return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

        socket.getaddrinfo = ipv4_getaddrinfo
        try:
            return super().open()
        finally:
            socket.getaddrinfo = original_getaddrinfo
