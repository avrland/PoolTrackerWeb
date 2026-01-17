from django.contrib import admin
from django.urls import path
from . import views

handler404 = views.handler404

urlpatterns = [
    path('', views.content_view),
    path('update_chart/stats<int:day>', views.update_chart),
    path('get_date_data/', views.get_date_data, name='get_date_data'),
    
    # Google Ads Donor Verification API
    path('api/verify-donor-email/', views.VerifyDonorEmailView.as_view(), name='verify_donor_email'),
    path('api/logout-ad-free/', views.LogoutAdFreeView.as_view(), name='logout_ad_free'),
]
