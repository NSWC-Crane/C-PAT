const express = require('express');
const db = require('../utils/sequelize');
const router = express.Router();

async function importAssets(req, res) {
    try {
        const { assets } = req.body;

        // Handle Assets
        for (const asset of assets) {
            const collection = asset.collection || {};
            const assetData = {
                assetId: asset.assetId,
                assetName: asset.name,
                fullyQualifiedDomainName: asset.fqdn || '',
                description: asset.description || '',
                ipAddress: asset.ip || '',
                macAddress: asset.mac || '',
                nonComputing: asset.noncomputing ? 1 : 0,
                collectionId: collection.collectionId || null,
                metadata: asset.metadata ? JSON.stringify(asset.metadata) : '{}',
            };

            // Find or create the asset
            const [assetRecord, assetCreated] = await db.Asset.findOrCreate({
                where: { assetName: asset.name },
                defaults: assetData
            });

            if (!assetCreated) {
                await assetRecord.update(assetData);
            }
        }

        res.status(200).json({ message: 'Assets Imported Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {
    importAssets
};
