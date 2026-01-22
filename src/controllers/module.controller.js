import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Module } from "../models/module.model.js";
import { Course } from "../models/course.model.js";

// TODO: Create a module
// Get the course id which you want to create a module for
// get all the required filde and validate
// check if any course with courseId exist or not
// Check if this module already exist
// and order of module has match with some other module
// At this point everything is good so we can create a module then validate and send back response.

// NOTE: Only Admin and instructor is allowed to add module so authorization will be done on router level with middleware authRole

const addModule = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new ApiError(400, "Valid courseId is required !!");
    }

    if (!title || !description || order === undefined) {
        throw new ApiError(400, "Title, description and order are required !!");
    }

    if (order < 0) {
        throw new ApiError(400, "Order must be a non-negative number !");
    }

    const course = await Course.findById(courseId);

    if (!course) {
        throw new ApiError(404, "Course not found !!");
    }

    const existingModule = await Module.findOne({
        courseId,
        order
    })

    if (existingModule) {
        throw new ApiError(409, "Module already exist !!")
    }

    const module = await Module.create({
        courseId,
        title,
        description,
        order
    });

    return res.status(201).json(
        new ApiResponse(201, module, "Module created successfully.")
    )
})

// TODO: Get module by id
// Get module id and validate
// get module by id and validate
// return the response

const getModuleById = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;

    if (!moduleId || !isValidObjectId(moduleId)) {
        throw new ApiError(400, "Valid moduleId is required !!");
    }

    const module = await Module.findById(moduleId);

    if (!module) {
        throw new ApiError(404, "Module not found !!")
    }

    return res.status(200).json(
        new ApiResponse(200, module, "Module get successfully.")
    )
})

// TODO: Update a module
// First check least one filde has to update
// get moduleId and validate
// get module by id first and validate
// Partially check which filde is send then update only those fildes
// save the module and return res

const updateModule = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const { title, description } = req.body;

    if (title === undefined && description === undefined) {
        throw new ApiError(400, "At least one field is required to update");
    }

    if (!moduleId || !isValidObjectId(moduleId)) {
        throw new ApiError(400, "Valid moduleId is required !!");
    }

    const module = await Module.findById(moduleId);

    if (!module) {
        throw new ApiError(404, "Module not found !!")
    }

    if (title) {
        module.title = title
    }

    if (description) {
        module.description = description
    }

    await module.save();

    return res.status(200).json(
        new ApiResponse(200, module, "Module updated successfully.")
    )
})

// TODO: Delete a module
// Get module id and validate 
// check if module exist or not
// then delete module
// return response

const deleteModule = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;

    if (!moduleId || !isValidObjectId(moduleId)) {
        throw new ApiError(400, "Valid moduleId is required !!");
    }

    const module = await Module.findById(moduleId);

    if (!module) {
        throw new ApiError(404, "Module not found !!");
    }

    await module.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Module deleted successfully.")
    );
});


export {
    addModule,
    updateModule,
    deleteModule,
    getModuleById
}