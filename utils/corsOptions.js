const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://crushif.app",
    "http://62.72.9.20",
    "http:/62.72.9.20:4040",
    "https://api.crushif.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;
