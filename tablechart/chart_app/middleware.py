class CssContentTypeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response['Content-Type'] == 'text/css':
            response['Content-Type'] = 'text/css; charset=utf-8'
        return response