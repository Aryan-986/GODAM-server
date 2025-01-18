import CategoryModel from "../models/category.model.js";

export const AddCategoryController = async(request,response) =>{
    try {
        const {name, image} = request.body

        if (!name || !image) {
            return response.status(400).json({
                message: "Enter required fields",
                error: true,
                success: false
            })
        }

        const addCategory = new CategoryModel({
            name,
            image
        })

        const saveCategory = await addCategory.save()

        if (!saveCategory){
            return response.status(500).json({
                message:"Not created",
                error : "true",
                success : false
            })
        }

        return response.json({
            message:"Add category",
            data : saveCategory,
            success : true,
            error: false
        })

        
    } catch (error) {
        return response.status(500).json({
            message:error.message || error,
            error: true,
            success: false
        })
    }

}
