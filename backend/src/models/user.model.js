import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email cannot exceed 254 characters'],
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
        'Please enter a valid email address',
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return password hash in regular queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a supported role',
      },
      default: 'user',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'disabled', 'suspended'],
      default: 'active',
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    preferences: {
      currency: {
        type: String,
        default: 'INR',
        enum: ['INR'],
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
      theme: {
        type: String,
        default: 'system',
        enum: ['system', 'light', 'dark'],
      },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Pre-save hook to hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  // Ensure password has already been hashed or hash it if passed plaintext
  if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error('User password hash is not loaded. Select "+passwordHash" in query.');
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Revoke tokens method
userSchema.methods.incrementTokenVersion = async function () {
  this.tokenVersion += 1;
  return this.save();
};

export const User = mongoose.model('User', userSchema);
export default User;
