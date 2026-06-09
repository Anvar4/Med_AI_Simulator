# API Reference

  Med AI Simulator backend exposes a RESTful API. All endpoints are prefixed with `/api`.

  ## Authentication

  Most endpoints require a valid JWT token in the `Authorization` header:

  ```
  Authorization: Bearer <token>
  ```

  ## Endpoints

  ### Auth

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | POST | `/api/auth/login` | Login with email & password |
  | POST | `/api/auth/register` | Register new user |
  | GET | `/api/auth/me` | Get current user info |
  | POST | `/api/auth/logout` | Logout current user |

  ### Cases

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/cases` | List all clinical cases |
  | GET | `/api/cases/:id` | Get single case |
  | POST | `/api/cases` | Create new case (admin) |
  | PUT | `/api/cases/:id` | Update case (admin) |
  | DELETE | `/api/cases/:id` | Delete case (admin) |

  ### Categories

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/categories` | List all categories |
  | POST | `/api/categories` | Create category (admin) |
  | DELETE | `/api/categories/:id` | Delete category (admin) |

  ### Attempts

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/attempts` | List user attempts |
  | POST | `/api/attempts` | Submit case attempt |
  | GET | `/api/attempts/:id` | Get attempt details |

  ### Health

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/health` | Server health check |

  ## Response Format

  All responses follow this structure:

  ```json
{
    "success": true,
    "data": {},
        "message": "Optional message"
}
```

  Error responses:

```json
{
    "success": false,
    "error": "Error message",
    "statusCode": 400
}
```

  ## Status Codes

  - `200` OK
  - `201` Created
  - `400` Bad Request
  - `401` Unauthorized
  - `403` Forbidden
  - `404` Not Found
  - `500` Internal Server Error
