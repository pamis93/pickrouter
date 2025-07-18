import generateError from "../utils/generateError.js";

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const message = error.details.map((d) => d.message).join(", ");
            return next(generateError("Datos inválidos: " + message, 400));
        }

        next();
    };
};

export default validate;
