require 'xcodeproj'

project_path = 'BestVersionOfYourself.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'BestVersionOfYourself' }

# Check if the phase already exists
existing_phase = target.shell_script_build_phases.find { |p| p.name == 'Copy Hermes dSYM' }

unless existing_phase
  phase = project.new(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
  phase.name = 'Copy Hermes dSYM'
  phase.shell_script = <<~SCRIPT
    HERMES_DSYM="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework/ios-arm64/hermesvm.framework/hermesvm.dSYM"
    if [ -d "$HERMES_DSYM" ]; then
        cp -r "$HERMES_DSYM" "${DWARF_DSYM_FOLDER_PATH}/"
    fi
  SCRIPT
  
  target.build_phases << phase
  project.save
  puts "Added 'Copy Hermes dSYM' build phase."
else
  puts "'Copy Hermes dSYM' build phase already exists."
end
