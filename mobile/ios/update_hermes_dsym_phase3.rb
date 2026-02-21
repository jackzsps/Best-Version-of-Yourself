require 'xcodeproj'

project_path = 'BestVersionOfYourself.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'BestVersionOfYourself' }

existing_phase = target.shell_script_build_phases.find { |p| p.name == 'Copy Hermes dSYM' }

if existing_phase
  existing_phase.shell_script = <<~SCRIPT
    # Generate Hermes dSYM directly into the build products directory
    HERMES_FRAMEWORK="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework/ios-arm64/hermesvm.framework/hermesvm"
    HERMES_DSYM_DEST="${DWARF_DSYM_FOLDER_PATH}/hermesvm.framework.dSYM"

    echo "Ensuring Hermes dSYM exists at ${HERMES_DSYM_DEST}..."
    if [ ! -d "$HERMES_DSYM_DEST" ]; then
        echo "Generating Hermes dSYM..."
        dsymutil "$HERMES_FRAMEWORK" -o "$HERMES_DSYM_DEST" || true
    else
        echo "Hermes dSYM already exists."
    fi
  SCRIPT
  
  project.save
  puts "Updated 'Copy Hermes dSYM' build phase to generate directly into destination."
else
  puts "Could not find 'Copy Hermes dSYM' build phase."
end
