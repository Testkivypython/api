# AGENTS.md - Developer Guide for Messanger Project

This is a Django REST Framework backend with React Native (Expo) frontend.

## Project Structure

```
/home/maksik/projects/messanger
├── api/                    # Django REST API
│   ├── chat/               # Main app (models, views, serializers, consumers)
│   ├── core/               # Django settings, URLs, ASGI/WGSI config
│   ├── manage.py           # Django management script
│   └── media/              # User uploaded files (thumbnails)
├── app/                    # React Native Expo frontend
│   ├── source/             # App source code (screens, components, etc.)
│   └── package.json
└── Makefile                # Development shortcuts
```

---

## Commands

### Backend (Django)

**Activate virtual environment:**
```bash
source venv/bin/activate.fish  # or source venv/bin/activate
```

**Run development server:**
```bash
cd api && python manage.py runserver
# or: make server
```

**Run a single test:**
```bash
cd api && python manage.py test chat.tests
# Run specific test class:
python manage.py test chat.tests.TestClassName
# Run specific test method:
python manage.py test chat.tests.TestClassName.test_method_name
```

**Run all tests:**
```bash
cd api && python manage.py test
```

**Create migrations:**
```bash
cd api && python manage.py makemigrations
```

**Apply migrations:**
```bash
cd api && python manage.py migrate
```

**Django shell:**
```bash
cd api && python manage.py shell
```

### Frontend (React Native/Expo)

**Start Expo dev server:**
```bash
cd app && npx expo start
# or: make run
```

**Run on specific platform:**
```bash
cd app && npx expo start --web
cd app && npx expo start --android
cd app && npx expo start --ios
```

### Additional Services

**Start Redis (required for Django Channels):**
```bash
redis-server
# or: make redis
```

---

## Code Style Guidelines

### Python (Django)

**Imports:**
- Standard library first, then third-party, then local
- Use absolute imports from project root
- Group: stdlib, third-party, local, relative (within app)

```python
# Correct
import json
import base64

from django.contrib.auth.models import AbstractUser
from django.db import models
from rest_framework import serializers
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from .serializers import UserSerializer
from .models import User
```

**Formatting:**
- 4 spaces indentation
- Max line length: 120 characters (soft limit)
- Use trailing commas in multi-line collections
- Add space around operators and after commas

**Naming:**
- `snake_case` for variables, functions, methods
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- Prefix private methods with underscore: `_private_method()`

**Types:**
- Use type hints where helpful, especially for public APIs
- No strict enforcement currently

**Error Handling:**
- Use Django REST Framework's `raise_exception=True` for validation
- Return proper HTTP status codes (400, 401, 403, 404, 500)
- Avoid bare `except:` - catch specific exceptions

**Django-Specific:**
- Use DRF views (APIView) for REST endpoints
- Use WebsocketConsumer for WebSocket connections
- Custom User model extends `AbstractUser`
- Serializer fields: explicit `extra_kwargs` for write-only fields

### JavaScript/React Native

**Imports:**
- React imports first, then third-party, then local
- Use absolute imports where configured

```javascript
// Correct
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import useGlobal from './source/core/global';
```

**Formatting:**
- 2 spaces indentation (Expo default)
- Use semicolons
- Prefer single quotes for strings
- Max line length: 100 characters

**Naming:**
- `camelCase` for variables, functions
- `PascalCase` for components and React components
- Prefix custom hooks with `use`: `useGlobal`, `useAuth`

**React/React Native:**
- Use functional components with hooks
- Use Zustand for global state management
- Use React Navigation for routing

---

## Architecture Notes

### Authentication
- JWT-based authentication using `djangorestframework-simplejwt`
- Tokens: `access` (short-lived) and `refresh` (long-lived)
- Frontend stores tokens using `expo-secure-store`

### WebSockets
- Django Channels with Redis channel layer
- `ChatConsumer` handles WebSocket connections
- Group-based messaging by username

### Models
- Custom `User` model extends `AbstractUser`
- `thumbnail` field for profile pictures (ImageField)

### Serializers
- `SignUpSerializer`: Handles user creation, lowercase normalization
- `UserSerializer`: Public user data with computed `name` field

---

## Testing

- Django tests go in `api/chat/tests.py`
- Use Django's `TestCase` class
- Test naming: `test_<description>`

---

## Dependencies

**Backend:**
- Django + DRF
- Django Channels + channels_redis
- djangorestframework-simplejwt
- Pillow (image processing)

**Frontend:**
- Expo SDK 54
- React Navigation 7
- Zustand (state)
- Axios (HTTP client)
- expo-secure-store, expo-image-picker

---

## Development Workflow

1. Start Redis: `make redis` or `redis-server`
2. Start backend: `make server`
3. Start frontend: `make run`
4. Access API at `http://localhost:8000`
5. Access frontend via Expo
