const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];

    if (!err.isOperational) {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
}

export { errorHandler }