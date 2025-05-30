# BladeSystem

A modern web application featuring Google OAuth authentication integration.

## 🚀 Features

- Google OAuth 2.0 Authentication
- Secure User Management
- Modern Frontend UI
- RESTful API Backend
- MongoDB Database Integration

## 🏗️ Project Structure

The project consists of two main components:

### Frontend (BladeSystemFrontend)
- Vue.js based frontend application
- Google OAuth integration
- Modern and responsive UI
- State management with Vuex

### Backend (BladeSystemBackend)
- Node.js/Express backend
- MongoDB database integration
- JWT authentication
- RESTful API endpoints

## 🛠️ Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Google Cloud Platform account for OAuth

### Environment Variables

#### Frontend (.env)
```
VUE_APP_GOOGLE_CLIENT_ID=your_google_client_id
VUE_APP_API_URL=http://localhost:3000
```

#### Backend (.env)
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/kevinchan3322/bladesystem.git
cd bladesystem
```

2. Frontend Setup:
```bash
cd BladeSystemFrontend
npm install
npm run serve
```

3. Backend Setup:
```bash
cd BladeSystemBackend
npm install
npm run dev
```

## 🔒 Security

- JWT token-based authentication
- Secure session management
- Protected API endpoints
- OAuth 2.0 implementation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
