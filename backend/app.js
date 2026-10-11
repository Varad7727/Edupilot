const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const authRoutes=require('./routes/auth.routes.js');
    const app=express();
    app.use(cors());
    app.use(cookieParser());
    app.use(express.json());
     

    app.use("/auth",authRoutes);
    module.exports=app;