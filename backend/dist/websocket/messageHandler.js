"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSockets = initializeWebSockets;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
function initializeWebSockets(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.auth.jwtSecret);
            socket.data.user = decoded;
            next();
        }
        catch (error) {
            console.error("Socket authentication error:", error);
            next(new Error("Authentication error"));
        }
    }));
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}, user: ${socket.data.user.id}`);
        socket.on("joinConversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`User ${socket.data.user.id} joined conversation: ${conversationId}`);
            socket.emit("conversationJoined", { conversationId });
        });
        socket.on("leaveConversation", (conversationId) => {
            socket.leave(conversationId);
            console.log(`User ${socket.data.user.id} left conversation: ${conversationId}`);
        });
        socket.on("sendMessage", (data) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Message received from ${socket.data.user.id} to conversation: ${data.conversationId}`);
            io.to(data.conversationId).emit("newMessage", {
                id: "server-temp-id",
                content: data.content,
                sender: socket.data.user,
                conversationId: data.conversationId,
                tempId: data.tempId,
            });
            socket.emit("messageSent", { tempId: data.tempId, status: "sent" });
        }));
        socket.on("typing", (conversationId) => {
            socket.to(conversationId).emit("userTyping", {
                user: socket.data.user,
                conversationId,
            });
        });
        socket.on("stopTyping", (conversationId) => {
            socket.to(conversationId).emit("userStoppedTyping", {
                user: socket.data.user,
                conversationId,
            });
        });
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
}
