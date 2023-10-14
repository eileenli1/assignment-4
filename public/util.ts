type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Reviews (empty for all)",
    endpoint: "/api/reviews",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Review",
    endpoint: "/api/reviews",
    method: "POST",
    fields: { link: "input", content: "input", rating: "input" },
  },
  {
    name: "Update Review",
    endpoint: "/api/reviews/:id",
    method: "PATCH",
    fields: { id: "input", update: { link: "input", content: "input", rating: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Review",
    endpoint: "/api/reviews/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Profile",
    endpoint: "/api/profiles/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Create Profile",
    endpoint: "/api/profiles/:username",
    method: "POST",
    fields: { username: "input", profilePicture: "input" },
  },
  {
    name: "Update Profile",
    endpoint: "/api/profiles/:username",
    method: "PATCH",
    fields: { username: "input", update: { user: "input", profilePicture: "input" } },
  },
  {
    name: "Delete Profile",
    endpoint: "/api/profiles/:username",
    method: "DELETE",
    fields: { username: "input" },
  },
  {
    name: "Get Comments by Post",
    endpoint: "/api/posts/:postId/comments",
    method: "GET",
    fields: { postId: "input" },
  },
  {
    name: "Add Comment",
    endpoint: "/api/posts/:postId/comment",
    method: "POST",
    fields: { text: "input", postId: "input" },
  },
  {
    name: "Delete Comment",
    endpoint: "/api/posts/comment/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Save Post to Favorites",
    endpoint: "/api/posts/:postId/save",
    method: "POST",
    fields: { postId: "input" },
  },
  {
    name: "Unsave Post from Favorites",
    endpoint: "/api/posts/:postId/save",
    method: "DELETE",
    fields: { postId: "input" },
  },
  {
    name: "Get Number Saves on Post",
    endpoint: "/api/posts/:postId/numSaves",
    method: "GET",
    fields: { postId: "input" },
  },
  {
    name: "Get User Favorites (empty for all)",
    endpoint: "/api/favorites",
    method: "GET",
    fields: { username: "input" },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${tag} name="${prefix}${name}"></${tag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
