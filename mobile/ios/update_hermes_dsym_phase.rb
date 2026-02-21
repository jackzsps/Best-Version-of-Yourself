require 'xcodeproj'

project_path = 'BestVersionOfYourself.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'BestVersionOfYourself' }

existing_phase = target.shell_script_build_phases.find { |p| p.name == 'Copy Hermes dSYM' }

if existing_phase
  existing_phase.shell_script = <<~SCRIPT
    HERMES_FRAMEWORK="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework/ios-arm64/hermesvm.framework/hermesvm"
    HERMES_DSYM="${HERMES_FRAMEWORK}.dSYM"

    if [ ! -d "$HERMES_DSYM" ]; then
        echo "Generating Hermes dSYM..."
        dsymutil "$HERMES_FRAMEWORK" -o "$HERMES_DSYM" || true
    fi

    if [ -d "$HERMES_DSYM" ]; then
        echo "Copying Hermes dSYM to ${DWARF_DSYM_FOLDER_PATH}..."
        cp -r "$HERMES_DSYM" "${DWARF_DSYM_FOLDER_PATH}/"
    fi
  SCRIPT
  
  project.save
  puts "Updated 'Copy Hermes dSYM' build phase."
else
  puts "Could not find 'Copy Hermes dSYM' build phase."
end
