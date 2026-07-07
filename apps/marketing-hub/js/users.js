// Users tab: manage users, roles, login passwords, and the admin pin.
// Moved out of Settings so Settings stays focused on budget and campaign structure.
(function () {
  const S = window.MB_STATE;
  const API = window.MB_API;
  let editingUserId = null; // which user's name is being edited inline

  function roleOptions(selected) {
    const order = (window.MB_AUTH && window.MB_AUTH.ROLE_ORDER) || ["admin", "budget_owner", "marketing_user", "viewer"];
    return order.map((r) => {
      const label = window.MB_AUTH ? window.MB_AUTH.roleLabel(r) : r;
      return `<option ${selected === r ? "selected" : ""} value="${r}">${S.escapeHtml(label)}</option>`;
    }).join("");
  }

  // Options for the per-user "home country" dropdown. Empty = no default (agenda shows all).
  function homeCountryOptions(selected) {
    const list = (S.state.data.settings.countries || []).slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    return `<option value="">(none)</option>` + list.map((c) =>
      `<option ${selected === c.id ? "selected" : ""} value="${c.id}">${S.escapeHtml(c.name)}</option>`).join("");
  }

  function render() {
    const root = document.getElementById("tab-users");
    root.innerHTML = `
      <div class="card">
        <h2>Users &amp; access</h2>
        <p class="muted small">Users log in by name and password and are used for the "Owner" field. The role controls what each user can see and do. New users start with password 1234 and must set their own at first login. Use "Reset password" to set someone back to 1234.</p>
        <div id="users-list"></div>
        <div class="row-3">
          <div><label>New user name</label><input id="new-user" type="text" placeholder="e.g. Gerrit Denayer" /></div>
          <div><label>Role</label><select id="new-user-role">${roleOptions("viewer")}</select></div>
          <div style="display:flex; align-items:end;"><button class="primary" id="add-user">Add</button></div>
        </div>
        <h3 style="margin-top:16px">Admin pin</h3>
        <p class="muted small">The pin protects the Settings and Users areas. Stored as a one-way hash. The master code always works.</p>
        <div class="row-3">
          <div><label>New pin</label><input id="new-pin" type="password" inputmode="numeric" placeholder="e.g. 4 digits" /></div>
          <div><label>Confirm pin</label><input id="new-pin2" type="password" inputmode="numeric" /></div>
          <div style="display:flex; align-items:end;"><button class="secondary" id="save-pin">Update pin</button></div>
        </div>
      </div>
    `;

    root.querySelector("#add-user").onclick = async () => {
      const name = root.querySelector("#new-user").value.trim();
      if (!name) return;
      const role = root.querySelector("#new-user-role").value || "viewer";
      const u = { id: API.uid(), name, role };
      await window.MB_AUTH.resetUserPassword(u); // default 1234, must change at first login
      (S.state.data.settings.users = S.state.data.settings.users || []).push(u);
      S.scheduleSave();
      S.notify();
      render();
    };

    root.querySelector("#save-pin").onclick = async () => {
      const p1 = root.querySelector("#new-pin").value.trim();
      const p2 = root.querySelector("#new-pin2").value.trim();
      if (!p1) return S.toast("Enter a new pin", "error");
      if (p1 !== p2) return S.toast("The two pins do not match", "error");
      await window.MB_AUTH.setAdminPin(p1);
      root.querySelector("#new-pin").value = "";
      root.querySelector("#new-pin2").value = "";
      S.toast("Admin pin updated", "success");
    };

    renderUsers();
  }

  function renderUsers() {
    const host = document.getElementById("users-list");
    const users = S.state.data.settings.users || [];
    if (users.length === 0) { host.innerHTML = "<p class='muted'>No users yet.</p>"; return; }
    host.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Home country</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${users.map((u) => `
              <tr data-id="${u.id}"${u.active === false ? ' style="opacity:.6"' : ""}>
                <td>${editingUserId === u.id
                  ? `<input class="u-name" type="text" value="${S.escapeHtml(u.name)}" />`
                  : S.escapeHtml(u.name)}</td>
                <td><select class="u-role" data-id="${u.id}">${roleOptions(u.role || "admin")}</select></td>
                <td><select class="u-home" data-id="${u.id}">${homeCountryOptions(u.homeCountryId || "")}</select></td>
                <td>${u.active === false ? `<span class="muted">Inactive</span>` : "Active"}</td>
                <td class="actions-cell">${editingUserId === u.id
                  ? `<button class="primary save-name" data-id="${u.id}">Save</button> <button class="secondary cancel-name">Cancel</button>`
                  : `<button class="secondary edit-name" data-id="${u.id}">Edit name</button> <button class="secondary toggle-active" data-id="${u.id}">${u.active === false ? "Activate" : "Deactivate"}</button> <button class="secondary reset-pw" data-id="${u.id}">Reset password</button> <button class="danger del-user" data-id="${u.id}">Delete</button>`}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    host.querySelectorAll(".u-role").forEach((sel) => {
      sel.onchange = () => {
        const u = users.find((x) => x.id === sel.dataset.id);
        if (u) { u.role = sel.value; S.scheduleSave(); S.notify(); }
      };
    });
    host.querySelectorAll(".u-home").forEach((sel) => {
      sel.onchange = () => {
        const u = users.find((x) => x.id === sel.dataset.id);
        if (u) { if (sel.value) u.homeCountryId = sel.value; else delete u.homeCountryId; S.scheduleSave(); }
      };
    });
    host.querySelectorAll(".edit-name").forEach((btn) => {
      btn.onclick = () => { editingUserId = btn.dataset.id; renderUsers(); };
    });
    host.querySelectorAll(".toggle-active").forEach((btn) => {
      btn.onclick = async () => {
        const u = users.find((x) => x.id === btn.dataset.id);
        if (!u) return;
        const deactivating = (u.active !== false);
        const msg = deactivating
          ? `Deactivate ${u.name}? They can no longer log in and won't appear for new owner assignments. Their past budget lines and events keep their name.`
          : `Reactivate ${u.name}? They can log in and be assigned again.`;
        if (!await S.confirmDialog(msg)) return;
        u.active = !deactivating;
        S.scheduleSave(); S.notify(); render();
      };
    });
    host.querySelectorAll(".cancel-name").forEach((btn) => {
      btn.onclick = () => { editingUserId = null; renderUsers(); };
    });
    const saveName = () => {
      const inp = host.querySelector(".u-name");
      const u = users.find((x) => x.id === editingUserId);
      if (u && inp) {
        const v = inp.value.trim();
        if (!v) { S.toast("Name cannot be empty", "error"); return; }
        u.name = v; S.scheduleSave(); S.notify();
      }
      editingUserId = null; renderUsers();
    };
    host.querySelectorAll(".save-name").forEach((btn) => { btn.onclick = saveName; });
    const nameInput = host.querySelector(".u-name");
    if (nameInput) {
      nameInput.focus();
      nameInput.onkeydown = (e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { editingUserId = null; renderUsers(); } };
    }
    host.querySelectorAll(".reset-pw").forEach((btn) => {
      btn.onclick = async () => {
        const u = users.find((x) => x.id === btn.dataset.id);
        if (!u) return;
        if (!await S.confirmDialog(`Reset ${u.name}'s password to the default 1234? They will set a new one at next login.`)) return;
        await window.MB_AUTH.resetUserPassword(u);
        render();
        S.toast("Password reset to 1234", "success");
      };
    });
    host.querySelectorAll(".del-user").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const u = users.find((x) => x.id === id);
        const used = S.state.data.activities.filter((a) => a.ownerId === id).length;
        const msg = used > 0 ? `Delete user "${u.name}"? ${used} budget lines list them as owner.` : `Delete user "${u.name}"?`;
        if (!await S.confirmDialog(msg)) return;
        S.state.data.settings.users = users.filter((x) => x.id !== id);
        S.scheduleSave();
        S.notify();
        render();
      };
    });
  }

  window.MB_USERS = { render };
})();
