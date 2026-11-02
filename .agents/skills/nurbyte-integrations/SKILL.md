---
name: nurbyte-integrations
description: Coordinate BO, DocFlow, Hosts Editor and website integration contracts.
---

Read actual producer/consumer code and .nurbyte/PROJECT.md. BO's integration docs can refer to older versions. Preserve main/preload/renderer boundaries, validate remote feeds and retain offline/error behavior. For BO/DocFlow compare roles, account status enforcement, payments, audit and shared database migrations. Test recipient isolation. Do not roll back to a notification API without recipient filtering after individual messages exist. Changing a schema requires explicit compatible rollout planning, not automatic migration in Preview builds.
