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
exports.getSimilarProperties = exports.getPropertiesByAgent = exports.getFeaturedProperties = exports.deletePropertyImage = exports.uploadPropertyImages = exports.deleteProperty = exports.updateProperty = exports.createProperty = exports.getPropertyById = exports.getAllProperties = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
const prisma = new client_1.PrismaClient();
const uploadConfig = Object.assign(Object.assign({}, config_1.default.upload), { propertiesDir: config_1.default.upload.propertiesDir ||
        path_1.default.join(process.cwd(), "uploads/properties"), allowedImageTypes: config_1.default.upload.allowedImageTypes || [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ], maxFiles: config_1.default.upload.maxFiles || 10 });
const getAllProperties = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc", status, minPrice, maxPrice, bedrooms, bathrooms, location, search, } = params;
    const skip = (page - 1) * limit;
    const filter = {};
    if (status)
        filter.status = status;
    if (location)
        filter.location = { contains: location, mode: "insensitive" };
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice)
            filter.price.gte = minPrice;
        if (maxPrice)
            filter.price.lte = maxPrice;
    }
    if (bedrooms) {
        filter.rooms = bedrooms;
    }
    if (bathrooms) {
        filter.bathrooms = bathrooms;
    }
    if (search) {
        filter.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
        ];
    }
    const total = yield prisma.property.count({
        where: filter,
    });
    const properties = yield prisma.property.findMany({
        skip,
        take: limit,
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
            _count: {
                select: {
                    images: true,
                },
            },
        },
    });
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    return {
        properties,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
});
exports.getAllProperties = getAllProperties;
const getPropertyById = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const property = yield prisma.property.findUnique({
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
    return property;
});
exports.getPropertyById = getPropertyById;
const createProperty = (data, agentId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!data.title || !data.status || !data.price || !data.location) {
        throw new errors_1.BadRequestError("Title, status, price, and location are required");
    }
    const createData = {
        title: data.title,
        description: data.description || "",
        status: data.status,
        price: data.price,
        size: data.size || 0,
        rooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        location: data.location,
        address: data.address || "",
        agent: {
            connect: { id: agentId },
        },
    };
    if (data.latitude !== undefined) {
        createData.latitude = data.latitude;
    }
    if (data.longitude !== undefined) {
        createData.longitude = data.longitude;
    }
    if (data.features && data.features.length > 0) {
        createData.features = {
            create: data.features.map((feature) => ({
                name: feature,
            })),
        };
    }
    const property = yield prisma.property.create({
        data: createData,
    });
    return property;
});
exports.createProperty = createProperty;
const updateProperty = (id, data, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingProperty = yield prisma.property.findUnique({
        where: { id },
        include: {
            features: true,
        },
    });
    if (!existingProperty) {
        throw new errors_1.NotFoundError("Property not found");
    }
    if (existingProperty.agentId !== userId) {
        throw new errors_1.BadRequestError("Not authorized to update this property");
    }
    const updateData = {};
    if (data.title !== undefined)
        updateData.title = data.title;
    if (data.description !== undefined)
        updateData.description = data.description;
    if (data.status !== undefined)
        updateData.status = data.status;
    if (data.price !== undefined)
        updateData.price = data.price;
    if (data.size !== undefined)
        updateData.size = data.size;
    if (data.bedrooms !== undefined)
        updateData.rooms = data.bedrooms;
    if (data.bathrooms !== undefined)
        updateData.bathrooms = data.bathrooms;
    if (data.location !== undefined)
        updateData.location = data.location;
    if (data.address !== undefined)
        updateData.address = data.address;
    if (data.latitude !== undefined)
        updateData.latitude = data.latitude;
    if (data.longitude !== undefined)
        updateData.longitude = data.longitude;
    const property = yield prisma.property.update({
        where: { id },
        data: updateData,
    });
    if (data.features) {
        yield prisma.propertyFeature.deleteMany({
            where: { propertyId: id },
        });
        for (const feature of data.features) {
            yield prisma.propertyFeature.create({
                data: {
                    name: feature,
                    property: {
                        connect: { id },
                    },
                },
            });
        }
    }
    return property;
});
exports.updateProperty = updateProperty;
const deleteProperty = (id, userId, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existingProperty = yield prisma.property.findUnique({
        where: { id },
        include: {
            images: true,
        },
    });
    if (!existingProperty) {
        throw new errors_1.NotFoundError("Property not found");
    }
    if (existingProperty.agentId !== userId && userRole !== "ADMIN") {
        throw new errors_1.BadRequestError("Not authorized to delete this property");
    }
    yield prisma.property.delete({
        where: { id },
    });
    if (existingProperty.images.length > 0) {
        for (const image of existingProperty.images) {
            const filename = image.filename || ((_a = image.url) === null || _a === void 0 ? void 0 : _a.split("/").pop());
            if (filename) {
                const imagePath = path_1.default.join(uploadConfig.propertiesDir, filename);
                if (fs_1.default.existsSync(imagePath)) {
                    fs_1.default.unlinkSync(imagePath);
                }
            }
        }
    }
    return true;
});
exports.deleteProperty = deleteProperty;
const uploadPropertyImages = (propertyId, userId, userRole, files) => __awaiter(void 0, void 0, void 0, function* () {
    const property = yield prisma.property.findUnique({
        where: { id: propertyId },
    });
    if (!property) {
        throw new errors_1.NotFoundError("Property not found");
    }
    if (property.agentId !== userId && userRole !== "ADMIN") {
        throw new errors_1.BadRequestError("Not authorized to upload images for this property");
    }
    if (!files || files.length === 0) {
        throw new errors_1.BadRequestError("No images uploaded");
    }
    const images = [];
    let orderIndex = 0;
    const existingImages = yield prisma.propertyImage.findMany({
        where: { propertyId },
        orderBy: { orderIndex: "desc" },
        take: 1,
    });
    if (existingImages.length > 0) {
        orderIndex = existingImages[0].orderIndex + 1;
    }
    for (const file of files) {
        const imageData = {
            url: `/uploads/properties/${file.filename}`,
            orderIndex: orderIndex++,
            property: {
                connect: { id: propertyId },
            },
        };
        const image = yield prisma.propertyImage.create({
            data: imageData,
        });
        images.push(image);
    }
    return images;
});
exports.uploadPropertyImages = uploadPropertyImages;
const deletePropertyImage = (propertyId, imageId, userId, userRole) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const property = yield prisma.property.findUnique({
        where: { id: propertyId },
    });
    if (!property) {
        throw new errors_1.NotFoundError("Property not found");
    }
    if (property.agentId !== userId && userRole !== "ADMIN") {
        throw new errors_1.BadRequestError("Not authorized to delete images for this property");
    }
    const image = yield prisma.propertyImage.findUnique({
        where: { id: imageId },
    });
    if (!image || image.propertyId !== propertyId) {
        throw new errors_1.NotFoundError("Image not found");
    }
    yield prisma.propertyImage.delete({
        where: { id: imageId },
    });
    const filename = (_a = image.url) === null || _a === void 0 ? void 0 : _a.split("/").pop();
    if (filename) {
        const imagePath = path_1.default.join(uploadConfig.propertiesDir, filename);
        if (fs_1.default.existsSync(imagePath)) {
            fs_1.default.unlinkSync(imagePath);
        }
    }
    return true;
});
exports.deletePropertyImage = deletePropertyImage;
const getFeaturedProperties = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 6) {
    const properties = yield prisma.property.findMany({
        where: { featured: true },
        take: limit,
        include: {
            images: true,
            agent: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return properties;
});
exports.getFeaturedProperties = getFeaturedProperties;
const getPropertiesByAgent = (agentId, params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;
    const filter = { agentId };
    if (status)
        filter.status = status;
    const total = yield prisma.property.count({
        where: filter,
    });
    const properties = yield prisma.property.findMany({
        skip,
        take: limit,
        where: filter,
        include: {
            images: true,
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
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    return {
        properties,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
});
exports.getPropertiesByAgent = getPropertiesByAgent;
const getSimilarProperties = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, limit = 3) {
    const property = yield prisma.property.findUnique({
        where: { id },
    });
    if (!property) {
        throw new errors_1.NotFoundError("Property not found");
    }
    const similarProperties = yield prisma.property.findMany({
        where: {
            id: { not: id },
            OR: [
                { location: { contains: property.location.split(",")[0] } },
                {
                    price: {
                        gte: Number(property.price) * 0.8,
                        lte: Number(property.price) * 1.2,
                    },
                },
            ],
        },
        take: limit,
        include: {
            images: true,
            agent: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
    });
    return similarProperties;
});
exports.getSimilarProperties = getSimilarProperties;
