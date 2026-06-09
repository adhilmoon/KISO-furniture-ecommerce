import User from "../../model/User.js";
import Address from "../../model/Address.js";

export const userRepository = {
    async findByEmail(email) {
        return User.findOne({ email });
    },
    async findByEmailExcluding(email, excludeId) {
        return User.findOne({ email, _id: { $ne: excludeId } });
    },
    async findById(id) {
        return User.findById(id);
    },
    async createUser(data) {
        return User.create(data);
    },
    async updateUser(id, updateData) {
        return User.findByIdAndUpdate(id, updateData, { new: true });
    },
    async updatePassword(email, hashedPassword) {
        return User.findOneAndUpdate({ email }, { password: hashedPassword });
    },

    // Address operations
    async createAddress(data) {
        return Address.create(data);
    },
    async findAddressById(id) {
        return Address.findById(id);
    },
    async findOneAddress(query) {
        return Address.findOne(query);
    },
    async findAddressesByUserId(userId, { skip = 0, limit = 0, sort = { isDefault: -1, createdAt: -1 } } = {}) {
        const query = Address.find({ userId }).sort(sort).skip(skip);
        return limit ? query.limit(limit) : query;
    },
    async countAddresses(userId) {
        return Address.countDocuments({ userId });
    },
    async updateManyAddresses(filter, update) {
        return Address.updateMany(filter, update);
    },
    async findAndUpdateAddress(query, update) {
        return Address.findOneAndUpdate(query, update, { new: true });
    },
    async deleteAddress(addressId, userId) {
        return Address.findOneAndDelete({ _id: addressId, userId });
    }
};