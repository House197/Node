import mongoose, { Schema } from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    available: {
        type: Boolean,
        default: false,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

categorySchema.set('toJSON', {
    virtuals: true, // coloca id como propiedad extra pero sin _.
    versionKey: false, // Quita version key
    transform: function(doc, ret, options) {
        delete ret._id; // Elimina _id
    }
});

export const CategoryModel = mongoose.model('Category', categorySchema);