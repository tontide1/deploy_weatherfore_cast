from django.shortcuts import render

def home_view(request):
    """
    View for the homepage
    """
    return render(request, 'web_app/home.html')
