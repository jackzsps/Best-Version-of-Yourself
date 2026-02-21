require 'xcodeproj'

project_path = 'mobile/ios/BestVersionOfYourself.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target_name = 'BestVersionOfYourself'

target = project.targets.find { |t| t.name == target_name }

if target
  phase_name = "Setup Firebase Credentials"
  existing_phase = target.shell_script_build_phases.find { |p| p.name == phase_name }

  if existing_phase
    puts "✅ '#{phase_name}' build phase already exists."
  else
    puts "Adding '#{phase_name}' build phase before Copy Bundle Resources..."
    phase = project.new(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
    phase.name = phase_name
    # Since Xcode runs this with SRCROOT = mobile/ios/BestVersionOfYourself
    phase.shell_script = "bash \"${SRCROOT}/../../scripts/setup-ios-firebase.sh\"\n"
    
    # Find the index of Copy Bundle Resources
    copy_resources_index = target.build_phases.find_index { |p| p.isa == 'PBXResourcesBuildPhase' }
    
    if copy_resources_index
      target.build_phases.insert(copy_resources_index, phase)
    else
      target.build_phases << phase
    end
    
    puts "✅ Added '#{phase_name}' build phase."
    project.save
  end
else
  puts "❌ Could not find target #{target_name}"
end
