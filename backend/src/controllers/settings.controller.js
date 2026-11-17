import * as service from '../services/settings.service.js'

export const get = async (req, res) => res.json({ data: await service.getSettings(req.user.sohId) })

export const update = async (req, res) =>
  res.json({ data: await service.updateSettings(req.user.sohId, req.body) })

export const listCategories = async (req, res) =>
  res.json({ data: await service.listCategories(req.user.sohId, req.validatedQuery.type) })

export const createCategory = async (req, res) =>
  res.status(201).json({ data: await service.createCategory(req.user.sohId, req.body) })

export const updateCategory = async (req, res) =>
  res.json({ data: await service.updateCategory(req.user.sohId, req.params.id, req.body) })

export const deleteCategory = async (req, res) => {
  await service.deleteCategory(req.user.sohId, req.params.id)
  res.status(204).end()
}
