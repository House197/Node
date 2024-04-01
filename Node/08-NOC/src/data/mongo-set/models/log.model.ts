import mongoose from "mongoose";

// Definir Schema, el cual define las reglas del objeto
const logSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['low','medium','high'],
        default: 'low',
    },
    message: {
        type: String,
        required: true,
    },
    origin: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
});

// Crear modelo para poder interactuar con Mongo.
export const LogModel = mongoose.model('log', logSchema);