const express = require('express');
const db = require('../utils/sequelize.js');
const router = express.Router();

async function importCollectionAndAssets(req, res) {
    try {
        const { collection, assets } = req.body;

        // Handle Collection
        const collectionData = {
            collectionId: collection.collectionId,
            collectionName: collection.name,
            description: collection.description || '',
            metadata: collection.metadata ? JSON.stringify(collection.metadata) : '{}',
            settings: collection.settings ? JSON.stringify(collection.settings) : '{}'
        };

        const [collectionRecord, created] = await db.Collection.findOrCreate({
            where: { collectionName: collection.name },
            defaults: collectionData
        });

        if (!created) {
            await collectionRecord.update(collectionData);
        }

        // Handle Assets
        for (const asset of assets) {
            const assetData = {
                assetId: asset.assetId,
                assetName: asset.name,
                fullyQualifiedDomainName: asset.fqdn || '',
                description: asset.description || '',
                ipAddress: asset.ip || '',
                macAddress: asset.mac || '',
                nonComputing: asset.noncomputing ? 1 : 0,
                collectionId: collectionRecord.collectionId, // Ensure this is correctly assigned
                metadata: asset.metadata ? JSON.stringify(asset.metadata) : '{}',
            };

            const [assetRecord, assetCreated] = await db.Asset.findOrCreate({
                where: { assetName: asset.name }, // Assuming assetName is unique
                defaults: assetData
            });

            if (!assetCreated) {
                await assetRecord.update(assetData);
            }
        }

        res.status(200).json({ message: 'Collection and Assets Imported Successfully' });
    } catch (error) {
        // Log the error and send a server error response
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    importCollectionAndAssets
};
