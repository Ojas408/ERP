import prisma from '../lib/prisma';
export const getSites = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const sites = await prisma.site.findMany({ where: { tenantId } });
        res.json(sites);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sites' });
    }
};
export const createSite = async (req, res) => {
    const tenantId = req.user.tenantId;
    const { name, location, status } = req.body;
    try {
        const site = await prisma.site.create({
            data: { tenantId, name, location, status },
        });
        res.status(201).json(site);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating site' });
    }
};
export const updateSite = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    const { name, location, status } = req.body;
    try {
        await prisma.site.updateMany({
            where: { id, tenantId },
            data: { name, location, status },
        });
        const site = await prisma.site.findFirst({ where: { id, tenantId } });
        res.json(site);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating site' });
    }
};
export const deleteSite = async (req, res) => {
    const tenantId = req.user.tenantId;
    const id = req.params.id;
    try {
        await prisma.site.deleteMany({ where: { id, tenantId } });
        res.json({ message: 'Site deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting site' });
    }
};
