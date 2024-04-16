import mongoose, { Schema } from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true
    },
    available: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number, 
        default: 0,
    },
    description: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
});

productSchema.set('toJSON', {
    virtuals: true, // coloca id como propiedad extra pero sin _.
    versionKey: false, // Quita version key
    transform: function(doc, ret, options) {
        delete ret._id; // Elimina _id
    }
});

export const ProductModel = mongoose.model('Product', productSchema);