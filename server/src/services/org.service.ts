import { Organization, OrgStatus } from '../models/Organization';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export async function listOrganizations(status?: OrgStatus) {
  const filter = status ? { status } : {};
  const orgs = await Organization.find(filter).sort({ createdAt: -1 }).lean();

  // Attach the admin (owner) and a member count for each org.
  const withDetails = await Promise.all(
    orgs.map(async (org) => {
      const [admin, memberCount] = await Promise.all([
        User.findOne({ organization: org._id, level: 10 }).select('name email').lean(),
        User.countDocuments({ organization: org._id }),
      ]);
      return { ...org, admin, memberCount };
    })
  );
  return withDetails;
}

export async function setOrganizationStatus(
  orgId: string,
  status: OrgStatus,
  approvedBy: string,
  rejectedReason?: string
) {
  const org = await Organization.findById(orgId);
  if (!org) throw ApiError.notFound('Organization not found');

  org.status = status;
  if (status === 'approved') {
    org.approvedBy = approvedBy as unknown as typeof org.approvedBy;
    org.approvedAt = new Date();
    org.rejectedReason = undefined;
  } else if (status === 'rejected') {
    org.rejectedReason = rejectedReason;
  }
  await org.save();
  return org;
}
