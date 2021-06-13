const express = require('express');
const { update } = require('../models/user');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');
const router = new express.Router();

router.post('', async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '新增使用者帳號'
   * #swagger.description = '新增登入用的使用者帳號'
   */
  /* #swagger.parameters['newUser'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { $ref: "#/definitions/AddUser" }
      } */
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get('/me', auth, async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '取得使用者資訊'
   * #swagger.description = '取得使用者資訊'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  res.status(200).send(req.user);
});

router.post('/login', async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '登入'
   * #swagger.description = '輸入帳號密碼後進行登入'
   */
  /* #swagger.parameters['User'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { $ref: "#/definitions/User" }
      } */
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.status(200).send({ user, token });
  } catch (err) {
    res.status(400).send();
  }
});

router.post('/logout', auth, async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '登出'
   * #swagger.description = '移除當前使用者所使用的token'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.send();
  } catch (err) {
    res.status(500).send();
  }
});
router.post('/logoutAll', auth, async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '全部登出'
   * #swagger.description = '移除當前使用者所有可以使用的token'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

router.patch('/me', auth, async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '更新使用者資料'
   * #swagger.description = '更新使用者資料'
   */
  /* #swagger.parameters['User'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { $ref: "#/definitions/User" }
      } */
  /* #swagger.security = [{
               "Bearer": []
      }] */
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValiOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValiOperation) {
    res.status(400).send('Error : Invalid updates!');
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();
    res.send(req.user);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete('/me', auth, async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '刪除使用者資料'
   * #swagger.description = '刪除使用者資料'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (err) {
    res.status(500).send(err);
  }
});

const upload = multer({
  limits: { fileSize: 1048576 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload jpg or jpeg or png'));
    }
    cb(undefined, true);
  },
});

router.post(
  '/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    /**
     * #swagger.tags = ["users"]
     * #swagger.summary = '上傳個人照片'
     * #swagger.description = '將上傳的圖片檔轉為二進制存入db，限定jpg|jpeg|png'
     */
    /* #swagger.parameters['avatar'] = {
               in: 'formData',
               required: true,
               type: 'file'
      } */
    /* #swagger.security = [{
               "Bearer": []
        }] */
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (err, req, res, next) => {
    res.status(400).send({ error: err.message });
  }
);

router.delete('/me/avatar', auth, async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '刪除個人照片'
   * #swagger.description = '將使用者圖片檔刪除'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get('/:id/avatar', async (req, res) => {
  /**
   * #swagger.tags = ["users"]
   * #swagger.summary = '取得個人圖片'
   * #swagger.description = '取得db內二進制的圖片'
   */
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send();
  }
});
module.exports = router;
