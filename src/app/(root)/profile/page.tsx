import HeaderBox from "@/components/HeaderBox";
import ProfileImageUploader from "@/components/ProfileImageUploader";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="flex min-w-0 flex-col gap-1 border-b border-gray-100 py-4 last:border-b-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-14 font-medium text-gray-500 dark:text-slate-400">
      {label}
    </dt>
    <dd className="min-w-0 break-words text-14 font-semibold text-gray-900 dark:text-slate-100 sm:text-right">
      {value || "-"}
    </dd>
  </div>
);

const Profile = async () => {
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    redirect("/sign-in");
  }

  const displayName =
    loggedIn.name ||
    `${loggedIn.firstName} ${loggedIn.lastName}`.trim() ||
    "NovaPay user";

  return (
    <section className="no-scrollbar h-full w-full overflow-y-auto bg-gray-25 px-5 py-6 dark:bg-slate-950 sm:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <HeaderBox
          title="Profile"
          subtext="Manage your NovaPay identity and profile picture."
        />

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <section className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ProfileImageUploader
              displayName={displayName}
              imageUrl={loggedIn.profileImageUrl}
              variant="inline"
            />
            <div className="min-w-0">
              <h2 className="truncate text-20 font-semibold text-gray-900 dark:text-slate-50">
                {displayName}
              </h2>
              <p className="mt-1 truncate text-14 text-gray-500 dark:text-slate-400">
                {loggedIn.email}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-18 font-semibold text-gray-900 dark:text-slate-50">
              Personal details
            </h2>
            <dl className="mt-4">
              <DetailRow label="First name" value={loggedIn.firstName} />
              <DetailRow label="Last name" value={loggedIn.lastName} />
              <DetailRow label="Email" value={loggedIn.email} />
              <DetailRow label="City" value={loggedIn.city} />
              <DetailRow label="State" value={loggedIn.state} />
              <DetailRow label="Postal code" value={loggedIn.postalCode} />
            </dl>
          </section>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-18 font-semibold text-gray-900 dark:text-slate-50">
            Account identifiers
          </h2>
          <dl className="mt-4">
            <DetailRow label="Appwrite user ID" value={loggedIn.userId} />
            <DetailRow
              label="Dwolla customer ID"
              value={loggedIn.dwollaCustomerId}
            />
            <DetailRow
              label="Profile image ID"
              value={loggedIn.profileImageId}
            />
          </dl>
        </section>
      </div>
    </section>
  );
};

export default Profile;
