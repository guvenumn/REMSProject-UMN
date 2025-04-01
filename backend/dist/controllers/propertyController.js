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
exports.uploadPropertyImages = exports.addPriceHistoryEntry = exports.getPropertyPriceHistory = exports.deleteProperty = exports.updateProperty = exports.createProperty = exports.getPropertiesByAgent = exports.getFeaturedProperties = exports.getSimilarProperties = exports.getPropertyById = exports.getAllProperties = exports.searchProperties = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
let prisma;
try {
    prisma = new client_1.PrismaClient();
}
catch (error) {
    console.error("Failed to initialize Prisma client:", error);
    prisma = null;
}
const getPrismaClient = () => {
    if (!prisma) {
        try {
            prisma = new client_1.PrismaClient();
        }
        catch (error) {
            console.error("Failed to initialize Prisma client:", error);
            throw new errors_1.ApiError("Database connection error", 500);
        }
    }
    return prisma;
};
const uploadConfig = Object.assign(Object.assign({}, config_1.default.upload), { propertiesDir: config_1.default.upload.propertiesDir ||
        path_1.default.join(process.cwd(), "uploads/properties"), allowedImageTypes: config_1.default.upload.allowedImageTypes || [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ], maxFiles: config_1.default.upload.maxFiles || 10 });
const createPriceHistoryEntry = (propertyId_1, price_1, previousPrice_1, userId_1, ...args_1) => __awaiter(void 0, [propertyId_1, price_1, previousPrice_1, userId_1, ...args_1], void 0, function* (propertyId, price, previousPrice, userId, reason = "INITIAL_LISTING", notes) {
    return getPrismaClient().priceHistory.create({
        data: {
            propertyId,
            price,
            previousPrice,
            reason,
            notes,
            createdById: userId,
            date: new Date(),
        },
    });
});
const formatPriceHistoryRecord = (history) => {
    let event = "Price update";
    switch (history.reason) {
        case "INITIAL_LISTING":
            event = "Initially listed";
            break;
        case "PRICE_REDUCTION":
            event = "Price reduced";
            break;
        case "PRICE_INCREASE":
            event = "Price increased";
            break;
        case "RELISTING":
            event = "Relisted";
            break;
        case "MARKET_ADJUSTMENT":
            event = "Market adjustment";
            break;
        default:
            event = history.notes || "Price update";
    }
    return {
        id: history.id,
        date: history.date.toISOString(),
        price: Number(history.price),
        previousPrice: history.previousPrice
            ? Number(history.previousPrice)
            : undefined,
        event,
        createdBy: history.createdBy,
        notes: history.notes,
        reason: history.reason,
    };
};
const verifyPropertyAccess = (propertyId_1, userId_1, userRole_1, ...args_1) => __awaiter(void 0, [propertyId_1, userId_1, userRole_1, ...args_1], void 0, function* (propertyId, userId, userRole, errorMessage = "Not authorized to perform this action") {
    const property = yield getPrismaClient().property.findUnique({
        where: { id: propertyId },
    });
    if (!property) {
        throw new errors_1.NotFoundError("Property not found");
    }
    const isAuthorized = property.agentId === userId || userRole === "ADMIN";
    if (!isAuthorized) {
        throw new errors_1.ApiError(errorMessage, 403);
    }
    return property;
});
const searchProperties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { location, page = "1", limit = "10", status, propertyType, listingType, } = req.query;
        logger_1.logger.info(`Property search: location=${location}, status=${status}, propertyType=${propertyType}, listingType=${listingType}, page=${page}, limit=${limit}`);
        if (!location || typeof location !== "string" || !location.trim()) {
            logger_1.logger.warn("Search attempted without location parameter");
            res.status(400).json({
                success: false,
                error: "Location is required for searching",
                data: [],
                pagination: {
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    total: 0,
                    totalPages: 0,
                },
            });
            return;
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const filter = {
            OR: [
                { location: { contains: location, mode: "insensitive" } },
                { address: { contains: location, mode: "insensitive" } },
            ],
        };
        if (status &&
            Object.values(client_1.PropertyStatus).includes(status)) {
            filter.status = status;
        }
        if (propertyType &&
            Object.values(client_1.PropertyType).includes(propertyType)) {
            filter.propertyType = propertyType;
        }
        if (listingType &&
            Object.values(client_1.ListingType).includes(listingType)) {
            filter.listingType = listingType;
        }
        const total = yield getPrismaClient().property.count({
            where: filter,
        });
        const properties = yield getPrismaClient().property.findMany({
            skip,
            take: limitNum,
            where: filter,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
                images: true,
                priceHistory: {
                    orderBy: {
                        date: "desc",
                    },
                    take: 2,
                },
                _count: {
                    select: {
                        images: true,
                    },
                },
            },
        });
        const totalPages = Math.ceil(total / limitNum);
        res.status(200).json({
            success: true,
            data: properties,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
        });
        logger_1.logger.info(`Property search complete: found ${properties.length} properties for "${location}"`);
    }
    catch (error) {
        logger_1.logger.error(`Property search error: ${error}`);
        next(error);
    }
});
exports.searchProperties = searchProperties;
const getAllProperties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", sort = "createdAt", order = "desc", status, minPrice, maxPrice, location, search, propertyType, listingType, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const filter = {};
        if (status &&
            Object.values(client_1.PropertyStatus).includes(status)) {
            filter.status = status;
        }
        if (propertyType &&
            Object.values(client_1.PropertyType).includes(propertyType)) {
            filter.propertyType = propertyType;
        }
        if (listingType &&
            Object.values(client_1.ListingType).includes(listingType)) {
            filter.listingType = listingType;
        }
        if (location) {
            filter.location = { contains: location, mode: "insensitive" };
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice)
                filter.price.gte = parseFloat(minPrice);
            if (maxPrice)
                filter.price.lte = parseFloat(maxPrice);
        }
        if (search) {
            filter.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
            ];
        }
        const total = yield getPrismaClient().property.count({
            where: filter,
        });
        const properties = yield getPrismaClient().property.findMany({
            skip,
            take: limitNum,
            where: filter,
            orderBy: {
                [sort]: order,
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
                images: true,
                priceHistory: {
                    orderBy: {
                        date: "desc",
                    },
                    take: 2,
                },
                _count: {
                    select: {
                        images: true,
                    },
                },
            },
        });
        const totalPages = Math.ceil(total / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;
        res.status(200).json({
            success: true,
            data: properties,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext,
                hasPrev,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Get all properties error: ${error}`);
        next(error);
    }
});
exports.getAllProperties = getAllProperties;
const getPropertyById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const property = yield getPrismaClient().property.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
                images: true,
                features: true,
                priceHistory: {
                    orderBy: {
                        date: "desc",
                    },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        images: true,
                    },
                },
            },
        });
        if (!property) {
            throw new errors_1.NotFoundError("Property not found");
        }
        const formattedPriceHistory = property.priceHistory.map(formatPriceHistoryRecord);
        let isFavorite = false;
        const sortedPriceHistory = [...formattedPriceHistory].reverse();
        res.status(200).json({
            success: true,
            data: Object.assign(Object.assign({}, property), { priceHistory: sortedPriceHistory, isFavorite }),
        });
    }
    catch (error) {
        logger_1.logger.error(`Get property by ID error: ${error}`);
        next(error);
    }
});
exports.getPropertyById = getPropertyById;
const getSimilarProperties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit || "3", 10);
        const property = yield getPrismaClient().property.findUnique({
            where: { id },
        });
        if (!property) {
            throw new errors_1.NotFoundError("Property not found");
        }
        const similarProperties = yield getPrismaClient().property.findMany({
            where: {
                id: { not: id },
                OR: [
                    { location: { contains: property.location.split(",")[0] } },
                    { propertyType: property.propertyType },
                    { listingType: property.listingType },
                ],
            },
            take: limit,
            include: {
                images: true,
                priceHistory: {
                    orderBy: {
                        date: "desc",
                    },
                    take: 2,
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            data: similarProperties,
        });
    }
    catch (error) {
        logger_1.logger.error(`Get similar properties error: ${error}`);
        next(error);
    }
});
exports.getSimilarProperties = getSimilarProperties;
const getFeaturedProperties = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const properties = yield getPrismaClient().property.findMany({
            where: { featured: true },
            take: 6,
            include: {
                images: true,
                agent: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                priceHistory: {
                    orderBy: {
                        date: "desc",
                    },
                    take: 2,
                },
                _count: {
                    select: {
                        images: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({
            success: true,
            data: properties,
        });
    }
    catch (error) {
        logger_1.logger.error(`Get featured properties error: ${error}`);
        next(error);
    }
});
exports.getFeaturedProperties = getFeaturedProperties;
const getPropertiesByAgent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { agentId } = req.params;
        const { page = "1", limit = "10", status, propertyType, listingType, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const filter = { agentId };
        if (status &&
            Object.values(client_1.PropertyStatus).includes(status)) {
            filter.status = status;
        }
        if (propertyType &&
            Object.values(client_1.PropertyType).includes(propertyType)) {
            filter.propertyType = propertyType;
        }
        if (listingType &&
            Object.values(client_1.ListingType).includes(listingType)) {
            filter.listingType = listingType;
        }
        const total = yield getPrismaClient().property.count({
            where: filter,
        });
        const properties = yield getPrismaClient().property.findMany({
            skip,
            take: limitNum,
            where: filter,
            include: {
                images: true,
                priceHistory: {
                    orderBy: {
                        date: "desc",
                    },
                    take: 2,
                },
                _count: {
                    select: {
                        images: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const totalPages = Math.ceil(total / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;
        res.status(200).json({
            success: true,
            data: properties,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext,
                hasPrev,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Get properties by agent error: ${error}`);
        next(error);
    }
});
exports.getPropertiesByAgent = getPropertiesByAgent;
const createProperty = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { title, description, status, price, size, rooms, bathrooms, location, address, propertyType, listingType, latitude, longitude, features, } = req.body;
        if (!title || !status || !price || !location) {
            throw new errors_1.BadRequestError("Title, status, price, and location are required");
        }
        const createData = {
            title,
            description,
            status,
            price: parseFloat(price),
            size: parseFloat(size || "0"),
            rooms: parseInt(rooms || "0", 10),
            bathrooms: parseInt(bathrooms || "0", 10),
            location,
            address,
            agent: {
                connect: { id: userId },
            },
        };
        if (propertyType &&
            Object.values(client_1.PropertyType).includes(propertyType)) {
            createData.propertyType = propertyType;
        }
        if (listingType &&
            Object.values(client_1.ListingType).includes(listingType)) {
            createData.listingType = listingType;
        }
        if (latitude !== undefined) {
            createData.latitude = parseFloat(latitude);
        }
        if (longitude !== undefined) {
            createData.longitude = parseFloat(longitude);
        }
        if (features && Array.isArray(features)) {
            createData.features = {
                create: features.map((feature) => ({
                    name: feature,
                })),
            };
        }
        const property = yield getPrismaClient().property.create({
            data: createData,
        });
        yield createPriceHistoryEntry(property.id, parseFloat(price), null, userId, "INITIAL_LISTING", "Property initially listed");
        res.status(201).json({
            success: true,
            message: "Property created successfully",
            data: property,
        });
    }
    catch (error) {
        logger_1.logger.error(`Create property error: ${error}`);
        next(error);
    }
});
exports.createProperty = createProperty;
const updateProperty = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const existingProperty = yield getPrismaClient().property.findUnique({
            where: { id },
            include: {
                features: true,
            },
        });
        if (!existingProperty) {
            throw new errors_1.NotFoundError("Property not found");
        }
        if (existingProperty.agentId !== userId && req.userRole !== "ADMIN") {
            throw new errors_1.ApiError("Not authorized to update this property", 403);
        }
        const { title, description, status, price, size, rooms, bathrooms, location, address, propertyType, listingType, latitude, longitude, features, priceChangeReason, priceChangeNotes, } = req.body;
        const updateData = {
            title,
            description,
            status,
            location,
            address,
        };
        if (propertyType &&
            Object.values(client_1.PropertyType).includes(propertyType)) {
            updateData.propertyType = propertyType;
        }
        if (listingType &&
            Object.values(client_1.ListingType).includes(listingType)) {
            updateData.listingType = listingType;
        }
        const isPriceChanged = price !== undefined &&
            parseFloat(price) !== Number(existingProperty.price);
        if (price !== undefined) {
            updateData.price = parseFloat(price);
        }
        if (size !== undefined) {
            updateData.size = parseFloat(size);
        }
        if (rooms !== undefined) {
            updateData.rooms = parseInt(rooms, 10);
        }
        if (bathrooms !== undefined) {
            updateData.bathrooms = parseInt(bathrooms, 10);
        }
        if (latitude !== undefined) {
            updateData.latitude = parseFloat(latitude);
        }
        if (longitude !== undefined) {
            updateData.longitude = parseFloat(longitude);
        }
        const property = yield getPrismaClient().property.update({
            where: { id },
            data: updateData,
        });
        if (isPriceChanged) {
            let reason = priceChangeReason || "OTHER";
            let notes = priceChangeNotes || "";
            if (!priceChangeReason) {
                const currentPrice = Number(existingProperty.price);
                const newPrice = parseFloat(price);
                if (newPrice < currentPrice) {
                    reason = "PRICE_REDUCTION";
                    notes = notes || `Price reduced from ${currentPrice} to ${newPrice}`;
                }
                else if (newPrice > currentPrice) {
                    reason = "PRICE_INCREASE";
                    notes =
                        notes || `Price increased from ${currentPrice} to ${newPrice}`;
                }
            }
            yield createPriceHistoryEntry(id, parseFloat(price), Number(existingProperty.price), userId, reason, notes);
        }
        if (features) {
            yield getPrismaClient().propertyFeature.deleteMany({
                where: { propertyId: id },
            });
            yield Promise.all(features.map((feature) => getPrismaClient().propertyFeature.create({
                data: {
                    name: feature,
                    property: {
                        connect: { id },
                    },
                },
            })));
        }
        res.status(200).json({
            success: true,
            message: "Property updated successfully",
            data: property,
        });
    }
    catch (error) {
        logger_1.logger.error(`Update property error: ${error}`);
        next(error);
    }
});
exports.updateProperty = updateProperty;
const deleteProperty = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const existingProperty = yield getPrismaClient().property.findUnique({
            where: { id },
            include: {
                images: true,
            },
        });
        if (!existingProperty) {
            throw new errors_1.NotFoundError("Property not found");
        }
        if (existingProperty.agentId !== userId && req.userRole !== "ADMIN") {
            throw new errors_1.ApiError("Not authorized to delete this property", 403);
        }
        yield getPrismaClient().property.delete({
            where: { id },
        });
        if (existingProperty.images.length > 0) {
            existingProperty.images.forEach((image) => {
                var _a;
                const filename = (_a = image.url) === null || _a === void 0 ? void 0 : _a.split("/").pop();
                if (filename) {
                    const imagePath = path_1.default.join(uploadConfig.propertiesDir, filename);
                    if (fs_1.default.existsSync(imagePath)) {
                        fs_1.default.unlinkSync(imagePath);
                    }
                }
            });
        }
        res.status(200).json({
            success: true,
            message: "Property deleted successfully",
        });
    }
    catch (error) {
        logger_1.logger.error(`Delete property error: ${error}`);
        next(error);
    }
});
exports.deleteProperty = deleteProperty;
const getPropertyPriceHistory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const property = yield getPrismaClient().property.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                price: true,
                priceHistory: {
                    orderBy: {
                        date: "desc",
                    },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!property) {
            throw new errors_1.NotFoundError("Property not found");
        }
        const formattedPriceHistory = property.priceHistory.map(formatPriceHistoryRecord);
        res.status(200).json({
            success: true,
            data: {
                propertyId: property.id,
                title: property.title,
                currentPrice: Number(property.price),
                priceHistory: formattedPriceHistory,
            },
        });
    }
    catch (error) {
        logger_1.logger.error(`Get property price history error: ${error}`);
        next(error);
    }
});
exports.getPropertyPriceHistory = getPropertyPriceHistory;
const addPriceHistoryEntry = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if (!userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        const { price, reason, notes } = req.body;
        if (!price || price <= 0) {
            throw new errors_1.BadRequestError("Valid price is required");
        }
        const existingProperty = yield verifyPropertyAccess(id, userId, req.userRole, "Not authorized to update price history");
        const priceHistory = yield getPrismaClient().priceHistory.create({
            data: {
                propertyId: id,
                price: parseFloat(price),
                previousPrice: Number(existingProperty.price),
                reason: reason || "OTHER",
                notes,
                createdById: userId,
                date: new Date(),
            },
        });
        yield getPrismaClient().property.update({
            where: { id },
            data: { price: parseFloat(price) },
        });
        res.status(201).json({
            success: true,
            message: "Price history entry added successfully",
            data: priceHistory,
        });
    }
    catch (error) {
        logger_1.logger.error(`Add price history entry error: ${error}`);
        next(error);
    }
});
exports.addPriceHistoryEntry = addPriceHistoryEntry;
const uploadPropertyImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const files = req.files;
        if (!userId) {
            throw new errors_1.ApiError("Authentication required", 401);
        }
        yield verifyPropertyAccess(id, userId, req.userRole, "Not authorized to upload images for this property");
        if (!files || files.length === 0) {
            throw new errors_1.BadRequestError("No images uploaded");
        }
        const highestOrderImage = yield getPrismaClient().propertyImage.findFirst({
            where: { propertyId: id },
            orderBy: { orderIndex: "desc" },
        });
        const startOrderIndex = highestOrderImage
            ? highestOrderImage.orderIndex + 1
            : 0;
        const imagePromises = files.map((file, index) => {
            return getPrismaClient().propertyImage.create({
                data: {
                    url: `/uploads/properties/${file.filename}`,
                    orderIndex: startOrderIndex + index,
                    property: {
                        connect: { id },
                    },
                },
            });
        });
        const images = yield Promise.all(imagePromises);
        res.status(200).json({
            success: true,
            message: "Images uploaded successfully",
            data: images,
        });
    }
    catch (error) {
        logger_1.logger.error(`Upload property images error: ${error}`);
        next(error);
    }
});
exports.uploadPropertyImages = uploadPropertyImages;
