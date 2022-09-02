class ApplicationError extends Error {
    constructor(msg, status) {
        super();
        this.message = msg;
        this.status = status;
    }
}

//function wrapper to handle async Errors
function handleError(fn) {
    return async function(req, res, next) {
        try {
            await fn(req, res, next);
        } catch(err) {
            return next(err);
        }
    }
}

module.exports = {
    ApplicationError,
    handleError
};