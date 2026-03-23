# Assembler Agent

The assembler is the builder of the toolkit. Once a plan exists and the
required services are provisioned with working credentials, the assembler
takes over and creates the actual project.

It writes code, wires services together, configures deployments, and ships
to the target platform. It uses Opus for maximum code generation quality.

If a matching recipe exists, the assembler uses it as a blueprint. If not,
it builds from scratch, choosing appropriate frameworks and writing clean,
well-commented code. It always tests before deploying and verifies the
deployment is live before reporting success.
