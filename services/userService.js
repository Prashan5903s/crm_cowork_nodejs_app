const mongoose = require('mongoose');
const Role = require('../model/Role');
const Country = require('../model/Country');
const RoleUser = require('../model/RoleUser');
const User = require('../model/User');
const Zone = require('../model/Zone');
const Department = require('../model/Department');
const Designation = require('../model/Designation');
const ParticipationType = require('../model/ParticipationType');
const bcrypt = require('bcryptjs');
const {
  hash,
  normalizeEmail,
  normalizePhone
} = require('../util/encryption');

const importUsers = async (res, userId, chunk, roleIds = []) => {
  try {
    const emails = chunk.map(u => normalizeEmail(u.Email)).filter(Boolean);
    const emailHashes = emails.map(email => hash(email));

    const existingEmailUsers = await User.find({
      email_hash: {
        $in: emailHashes
      },
      user_type: {
        $ne: "4"
      }
    }).select('email_hash').lean();
    const existingEmailHashes = new Set(existingEmailUsers.map(u => u.email_hash));

    const phones = chunk.map(u => normalizePhone(String(u.PhoneNo || ''))).filter(Boolean);
    const phoneHashes = phones.map(phone => hash(phone));

    const existingPhoneUsers = await User.find({
      phone_hash: {
        $in: phoneHashes
      },
      user_type: {
        $ne: "4"
      }
    }).select('phone_hash').lean();
    const existingPhoneHashes = new Set(existingPhoneUsers.map(u => u.phone_hash));

    const usersToInsert = [];
    const resultWithStatus = [];

    for (const u of chunk) {
      const email = normalizeEmail(u.Email || '');
      const phone = normalizePhone(String(u.PhoneNo || ''));
      const emailHash = hash(email);
      const phoneHash = hash(phone);

      const safeUser = JSON.parse(JSON.stringify(u));
      let errors = {};
      let validate = true;

      if (existingEmailHashes.has(emailHash)) {
        errors.email = 'This email has already been taken!';
      }

      if (existingPhoneHashes.has(phoneHash)) {
        errors.phone = 'This phone has already been taken!';
      }

      const result = await processEmployeeCodesForUser({
        rawCodes: u.EmpID,
        userId: null,
        existingUser: null,
      });

      if (!result.success) {
        errors.emp_id = result.message;
      }

      const location = await getLocationByName(u.Country, u.State, u.City);

      if (location.errors) {
        resultWithStatus.push({
          ...safeUser,
          errors: location.errors
        });
        continue;
      }

      if (validate) {
        try {
          const passwordRaw = u.password || u.EmpID || Math.floor(1111 + Math.random() * 8888).toString();
          const hashedPassword = await bcrypt.hash(passwordRaw, 12);

          const designationId = await getOrCreateDesignation(u.Designation, userId);
          const participationTypeId = await getOrCreateParticipationType(u.ParticipationType, userId);
          const zoneId = await getOrCreateZone(u.Zone, userId);

          let departmentId = '';
          let regionId = '';
          let branchId = '';

          const zoneData = await getOrCreateBranch(zoneId, u?.Region, u?.Branch, userId);

          if (!zoneData[2]) {
            errors.zone = zoneData[3];
          }

          if (Object.keys(errors).length > 0) {
            resultWithStatus.push({
              ...safeUser,
              errors
            });
            continue;
          }

          regionId = zoneData[0];
          branchId = zoneData[1];

          if (u.Department) {
            departmentId = await getOrCreateDepartment(u.Department, userId);
          }

          usersToInsert.push({
            email,
            email_hash: emailHash,
            phone,
            phone_hash: phoneHash,
            first_name: u.FirstName.trim(),
            last_name: u.LastName.trim(),
            password: hashedPassword,
            address: u.Address,
            country_id: location?.country || null,
            state_id: location?.state || null,
            city_id: location?.city || null,
            pincode: u.PinCode,
            status: u.Status?.toLowerCase() === 'active' ? true : (u.Status?.toLowerCase() === 'inactive' ? false : null),
            application_no: u.ApplicationNo || '',
            licence_no: u.LicenseNo || '',
            urn_no: u.URNNumber || '',
            website: u.Website || '',
            codes: result.codes || [],
            department_id: departmentId || '',
            designation_id: designationId,
            participation_type_id: participationTypeId,
            zone_id: zoneId,
            region_id: regionId || '',
            branch_id: branchId || '',
            employee_type: u.EmployeeType || '',
            company_id: userId,
            master_company_id: userId,
            parent_company_id: userId,
            created_by: userId,
          });



          resultWithStatus.push({
            ...safeUser,
            errors: {}
          });
        } catch (innerErr) {
          console.error('User insert error:', innerErr);
          resultWithStatus.push({
            ...safeUser,
            errors: {
              error: 'Error processing this user'
            }
          });
        }
      }
    }

    let insertedUsers = [];
    if (usersToInsert.length > 0) {
      insertedUsers = await User.insertMany(usersToInsert);

      if (roleIds.length > 0) {
        const roleDocs = await Role.find({
          _id: {
            $in: roleIds
          }
        });

        const roleUserInserts = [];
        for (const user of insertedUsers) {
          for (const role of roleDocs) {
            roleUserInserts.push({
              user_id: user._id,
              role_id: role._id,
              assigned_by: userId,
            });
          }
        }

        if (roleUserInserts.length > 0) {
          await RoleUser.insertMany(roleUserInserts);
        }
      }
    }

    return {
      success: true,
      message: `${usersToInsert.length} users imported.`,
      imported: usersToInsert.length,
      data: resultWithStatus,
    };
  } catch (error) {
    console.error("Import Error:", error);
    return {
      success: false,
      message: 'An error occurred during import.',
      imported: 0,
      data: [],
    };
  }
};

const getOrCreateDepartment = async (department, userId) => {
  try {
    let departments = await Department.findOne({
      name: department,
      created_by: userId
    });
    if (!departments) {
      departments = new Department({
        name: department,
        created_by: userId,
        company_id: userId,
        status: true
      });
      await departments.save();
    }
    return departments._id;
  } catch (error) {
    throw new Error(error);
  }
};

const getLocationByName = async (countryName, stateName, cityName) => {
  const errors = {};

  const countryDoc = await Country.findOne({
    country_name: new RegExp(`^${countryName?.trim()}$`, 'i'),
  }).lean();

  if (!countryDoc) {
    errors.country = `Country '${countryName}' not found`;
    return {
      errors
    };
  }

  const stateDoc = countryDoc.states.find(
    s => s.state_name.trim().toLowerCase() === stateName?.trim().toLowerCase()
  );

  if (!stateDoc) {
    errors.state = `State '${stateName}' not found in '${countryName}'`;
    return {
      errors
    };
  }

  const cityDoc = stateDoc.cities.find(
    c => c.city_name.trim().toLowerCase() === cityName?.trim().toLowerCase()
  );

  if (!cityDoc) {
    errors.city = `City '${cityName}' not found in '${stateName}'`;
    return {
      errors
    };
  }

  return {
    country: countryDoc.country_id,
    state: stateDoc.state_id,
    city: cityDoc.city_id,
    errors: null
  };
};

const processEmployeeCodesForUser = async ({
  rawCodes,
  userId,
  existingUser = null
}) => {
  let parsedCodes = [];
  try {
    parsedCodes = rawCodes;
    if (!Array.isArray(parsedCodes)) {
      parsedCodes = [parsedCodes];
    }
  } catch {
    return {
      success: true,
      codes: existingUser?.codes || []
    };
  }

  if (parsedCodes.length === 0) {
    return {
      success: true,
      codes: existingUser?.codes || []
    };
  }

  const normalizedCodes = parsedCodes
    .map(code => (code != null ? String(code).trim() : ''))
    .filter(Boolean);

  const duplicateUsers = await User.find({
    'codes.code': {
      $in: normalizedCodes
    },
    user_type: {
      $ne: "4"
    }
  }).select('codes');

  const foundCodes = new Set();
  for (const user of duplicateUsers) {
    user.codes.forEach(c => {
      const codeLower = c.code;
      if (normalizedCodes.includes(codeLower)) {
        foundCodes.add(codeLower);
      }
    });
  }
  if (foundCodes.size > 0) {
    return {
      success: false,
      message: 'Duplicate employee ID(s) found in other users.',
      duplicates: Array.from(foundCodes)
    };
  }

  const existingCodesMap = new Map(
    (existingUser?.codes || []).map(c => [c.code.toLowerCase(), c])
  );

  const updatedExistingCodes = (existingUser?.codes || []).map(codeObj => ({
    ...codeObj.toObject ? codeObj.toObject() : codeObj,
    type: 'inactive',
  }));

  for (const code of normalizedCodes) {
    if (!existingCodesMap.has(code)) {
      updatedExistingCodes.push({
        code,
        issued_on: new Date(),
        type: 'active',
      });
    } else {
      const index = updatedExistingCodes.findIndex(c => c.code.toLowerCase() === code);
      if (index !== -1) {
        updatedExistingCodes[index].type = 'active';
      }
    }
  }

  return {
    success: true,
    codes: updatedExistingCodes
  };
};

const getUserStats = async (userId) => {
  try {
    const [total, active, inactive] = await Promise.all([
      User.countDocuments({
        company_id: userId
      }),
      User.countDocuments({
        company_id: userId,
        status: true
      }),
      User.countDocuments({
        company_id: userId,
        status: false
      }),
    ]);

    return {
      total_users: total,
      active_users: active,
      inactive_users: inactive,
      not_logged_in_users: 0,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

const getOrCreateDesignation = async (name, userId) => {
  if (!name) return null;

  const trimmedName = name.trim();
  let designation = await Designation.findOne({
    name: new RegExp(`^${trimmedName}$`, 'i'),
    company_id: userId
  });

  if (!designation) {
    designation = await Designation.create({
      name: trimmedName,
      status: true,
      company_id: userId
    });
  }
  return designation._id;
};

const getOrCreateParticipationType = async (name, userId) => {
  if (!name) return null;

  const trimmedName = name.trim();
  let participationType = await ParticipationType.findOne({
    name: new RegExp(`^${trimmedName}$`, 'i'),
    company_id: userId
  });

  if (!participationType) {
    participationType = await ParticipationType.create({
      name: trimmedName,
      status: true,
      company_id: userId
    });
  }
  return participationType._id;
};

const getOrCreateZone = async (name, userId) => {
  if (!name) return null;

  const trimmedName = name.trim();
  let zone = await Zone.findOne({
    name: new RegExp(`^${trimmedName}$`, 'i'),
    created_by: userId
  });

  if (!zone) {
    zone = await Zone.create({
      name: trimmedName,
      status: true,
      company_id: userId,
      created_by: userId
    });
  }
  return zone._id;
};

const getOrCreateBranch = async (zoneId, region = "", branch = "", userId) => {
  try {

    if (!region && !branch) {
      return ["", "", true, ""];
    }

    const zone = await Zone.findOne({
      _id: zoneId,
      created_by: userId
    });

    if (!zone) {
      return ["", "", false, "Zone not found for this user"];
    }

    const otherZones = await Zone.find({
      _id: {
        $ne: zoneId
      },
      created_by: userId,
    });

    if (region) {
      for (const z of otherZones) {
        const existingRegion = z.region.find(
          (r) => r.name.toLowerCase() === region.toLowerCase()
        );
        if (existingRegion) {
          return ["", "", false, `Region '${region}' already exists in another zone`];
        }
      }
    }

    if (branch) {
      for (const z of otherZones) {
        for (const r of z.region) {
          const existingBranch = r.branch.find(
            (b) => b.name.toLowerCase() === branch.toLowerCase()
          );
          if (existingBranch) {
            return ["", "", false, `Branch '${branch}' already exists in another zone/region.`];
          }
        }
      }
    }

    let regionObj = null;
    let branchObj = null;

    if (region) {
      regionObj = zone.region.find(
        (r) => r.name.toLowerCase() === region.toLowerCase()
      );

      if (!regionObj) {
        regionObj = {
          _id: new mongoose.Types.ObjectId(),
          name: region,
          company_id: zone.company_id,
          master_company_id: zone.master_company_id,
          parent_company_id: zone.parent_company_id,
          created_by: userId,
          branch: [],
        };
        zone.region.push(regionObj);
      }
    }

    if (branch) {
      if (!regionObj) {
        return ["", "", false, "Branch cannot be created without a valid region in this zone."];
      }

      branchObj = regionObj.branch.find(
        (b) => b.name.toLowerCase() === branch.toLowerCase()
      );

      if (!branchObj) {
        branchObj = {
          _id: new mongoose.Types.ObjectId(),
          name: branch,
        };
        regionObj.branch.push(branchObj);
      }
    }

    await zone.save();

    return [
      regionObj ? regionObj._id.toString() : "",
      branchObj ? branchObj._id.toString() : "",
      true,
      "Region/Branch created or reused successfully",
    ];
  } catch (error) {
    return ["", "", false, error.message || "Unexpected error"];
  }
};

module.exports = {
  importUsers,
  getUserStats,
};