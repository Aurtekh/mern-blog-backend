const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');

const getFs = require('@cyclic.sh/s3fs');
const fs = getFs(process.env.CYCLIC_BUCKET_NAME);

const { registerValidation, loginValidation, postCreateValidation } = require('./validations.js');

const { UserController, PostController } = require('./controllers/index.js');
const { checkAuth, handleValidationErrors } = require('./utils/index.js');

mongoose.set('strictQuery', true);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('DB OK');
  })
  .catch(() => {
    console.log('DB error');
  });
const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.exists('uploads')) {
      fs.mkdir('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});
app.get('/tags', PostController.getLastTags);
app.get('/posts', PostController.getAll);
app.get('/posts/tags', PostController.getLastTags);
app.get('/posts/:id', PostController.getOne);
app.post('/posts', checkAuth, postCreateValidation, handleValidationErrors, PostController.create);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.patch(
  '/posts/:id',
  checkAuth,
  postCreateValidation,
  handleValidationErrors,
  PostController.update,
);

app.listen(process.env.PORT || 4444, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log('Server Ok');
});
