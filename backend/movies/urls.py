"""
URL configuration for movies app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'movies'

# This is handled in config/urls.py via router
# but keeping this file for clarity and potential standalone use
