import prisma from '../config/prisma.js';

// ---- ZONES ----
export const getZones = async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({ include: { sites: true } });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
};

export const createZone = async (req, res) => {
  try {
    const { zone_name, zone_code } = req.body;
    const zone = await prisma.zone.create({
      data: { 
        zone_name, 
        zone_code: zone_code || null 
      }
    });
    res.status(201).json(zone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create zone', details: error.message });
  }
};

export const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { zone_name, zone_code } = req.body;
    const zone = await prisma.zone.update({
      where: { id: parseInt(id) },
      data: { 
        zone_name, 
        zone_code: zone_code || null 
      }
    });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update zone' });
  }
};

// ---- SITES ----
export const getSites = async (req, res) => {
  try {
    const sites = await prisma.site.findMany({ include: { zone: true, rooms: true } });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
};

export const createSite = async (req, res) => {
  try {
    const { site_name, zone_id, site_type, location, total_rooms, unit_code } = req.body;
    
    // Auto-generate a unit_code if one isn't provided
    const finalUnitCode = unit_code || (site_name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000));
    
    const site = await prisma.site.create({
      data: {
        site_name, 
        zone_id: parseInt(zone_id), 
        site_type, // Enum: hotel, service_apartment
        location,
        total_rooms: parseInt(total_rooms) || 0,
        unit_code: finalUnitCode
      }
    });
    res.status(201).json(site);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create site', details: error.message });
  }
};

export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { site_name, zone_id, site_type, location, total_rooms, unit_code } = req.body;
    
    const updateData = {
      site_name, 
      zone_id: parseInt(zone_id), 
      site_type, 
      location,
      total_rooms: parseInt(total_rooms) || 0,
    };
    
    if (unit_code) {
      updateData.unit_code = unit_code;
    }
    
    const site = await prisma.site.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update site' });
  }
};
