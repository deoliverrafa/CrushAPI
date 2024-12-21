const corsOptions = {
    origin: ["http://localhost:5173", "https://crushif.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  
  export default corsOptions;  