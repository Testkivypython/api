from django.urls import path
from .views import SignInView, SignUpView, RequestVerificationView

urlpatterns = [
    path('signin/', SignInView.as_view()),
    path('signup/', SignUpView.as_view()),
    path('request-verification/', RequestVerificationView.as_view()),
]
