import { Express } from "express";
import { registerUserController,verifyUserController,loginUserController, getUsersController, getUserByIdController, updateUserController, deleteUserController } from "./auth.controller";

const user = (app: Express) => {
    // register user route
    app.route("/auth/register").post(
        async (req, res, next) => {
            try {
                await registerUserController(req, res);
            } catch (error: any) {
                next(error); //means that if an error occurs, it will be passed to the next middleware, which in this case is the error handler
            }
        }
    )
   // verify user route
    app.route("/auth/verify").post(
        async (req, res, next) => {
            try {
                await verifyUserController(req, res)
            } catch (error) {
                next(error)
            }
        }
    )
    // login user route
    app.route("/auth/login").post(
        async (req, res, next) => {
            try {
                await loginUserController(req, res);
            } catch (error: any) {
                next(error); 
            }
        }
    )

    // get all users route
    app.route('/users').get(
        async (req, res, next) => {
            try {
                await getUsersController(req, res);
            } catch (error: any) {
                next(error); // Passes the error to the next middleware
            }
        }
    )

    // get user by id route
    app.route('/user/:id').get(
        async (req, res, next) => {
            try {
                await getUserByIdController(req, res);
            } catch (error: any) {
                next(error); // Passes the error to the next middleware
            }
        }
    )

    // update user by id route
    app.route('/user/:id').put(
        async (req, res, next) => {
            try {
                await updateUserController(req, res);
            } catch (error: any) {
                next(error); // Passes the error to the next middleware
            }
        }
    )

    // delete user by id route
    app.route('/user/:id').delete(
        async (req, res, next) => {
            try {
                await deleteUserController(req, res);
            } catch (error: any) {
                next(error); // Passes the error to the next middleware
            }
        }
    )
}

export default user;