const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('', auth, async (req, res) => {
  /**
   * #swagger.tags = ["tasks"]
   * #swagger.summary = '新增任務'
   * #swagger.description = '新增代辦事項的任務'
   */
  /* #swagger.parameters['task'] = {
               in: 'body',
               required: true,
               type: 'object',
               schema: { $ref: "#/definitions/task" }
      } */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
//get /tasks?completed=true
//get /tasks?limit=10&skip=0
//get /tasks?sortBy=createdAt:desc
router.get('', auth, async (req, res) => {
  /**
   * #swagger.tags = ["tasks"]
   * #swagger.summary = '取得任務'
   * #swagger.description = '取得此使用者所有代辦事項，並做出分頁及排序或篩選'
   * #swagger.parameters['completed'] = {description: '是否完成-false',required: false}
   * #swagger.parameters['limit'] = { description: '一次請求最多幾筆資料回傳-10',required: false }
   * #swagger.parameters['skip'] = { description: '省略幾筆-0',required: false }
   * #swagger.parameters['sortBy'] = { description: '依照什麼做排序-createdAt:desc',required: false }
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.status(200).send(req.user.tasks);
  } catch (err) {
    res.status(500).send();
  }
});

router.get('/:id', auth, async (req, res) => {
  /**
   * #swagger.tags = ["tasks"]
   * #swagger.summary = '取特定代辦事項'
   * #swagger.description = '依照task-id取得特定的代辦事項資料'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      res.status(404).send();
    }
    res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});

router.patch('/:id', auth, async (req, res) => {
  /**
   * #swagger.tags = ["tasks"]
   * #swagger.summary = '取得特定代辦事項'
   * #swagger.description = '依照task-id取得特定的代辦事項資料'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  const updates = Object.keys(req.body);
  const allowedUpdates = ['completed', 'description'];
  const isValiOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValiOperation) {
    res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });

    if (!task) {
      res.status(404).send();
    }
    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    await task.save();
    res.send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete('/:id', auth, async (req, res) => {
  /**
   * #swagger.tags = ["tasks"]
   * #swagger.summary = '刪除特定代辦事項'
   * #swagger.description = '依照task-id取得特定的代辦事項資料'
   */
  /* #swagger.security = [{
               "Bearer": []
        }] */
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });
    if (!task) {
      res.status(404).send();
    }
    res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});
module.exports = router;
