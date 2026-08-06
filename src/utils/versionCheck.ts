export interface GitHubRelease {
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    assets: {
        name: string;
        browser_download_url: string;
    }[];
}

export async function checkForUpdate(
    currentVersion: string
) {
    const res = await fetch(
        `https://api.github.com/repos/josephchaouistannard/predictio-vue-app/releases/latest`,
        {
            headers: {
                Accept: "application/vnd.github+json",
            },
        }
    );

    if (!res.ok) {
        throw new Error("Unable to check updates");
    }

    const release: GitHubRelease = await res.json();

    const latest = release.tag_name.replace(/^v/, "");

    return {
        available: compareVersions(latest, currentVersion) > 0,
        version: latest,
        notes: release.body,
        release,
    };
}

function compareVersions(a: string, b: string) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
        if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
        if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
    }

    return 0;
}