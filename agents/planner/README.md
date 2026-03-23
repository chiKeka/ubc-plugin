# Planner Agent

The planner takes a user's goal and figures out which free-tier services
to combine to make it happen. It reads the service catalog, checks
free-tier limits, and looks for matching recipes.

Its output is a structured YAML plan listing every service needed, the
role each one plays, the steps to provision and assemble them, and any
warnings about limits that might be hit.

The planner never creates accounts or writes code. It only plans. The
provisioner and assembler agents execute the plan it produces.
