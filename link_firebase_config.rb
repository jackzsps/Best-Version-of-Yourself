require 'xcodeproj'

project_path = 'mobile/ios/BestVersionOfYourself.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target_name = 'BestVersionOfYourself'

target = project.targets.find { |t| t.name == target_name }

if target
  group_path = 'BestVersionOfYourself'
  group = project.main_group.find_subpath(group_path, true)
  
  file_path = 'BestVersionOfYourself/GoogleService-Info.plist'
  
  # Check if file is already in the group
  file_ref = group.files.find { |f| f.path == 'GoogleService-Info.plist' }
  
  if !file_ref
    file_ref = group.new_reference('GoogleService-Info.plist')
    puts "✅ Added reference for GoogleService-Info.plist to group #{group_path}"
  end

  # Check if it's already in the Build Phase (Resources)
  resources_build_phase = target.resources_build_phase
  if !resources_build_phase.files_references.include?(file_ref)
    resources_build_phase.add_file_reference(file_ref)
    puts "✅ Added GoogleService-Info.plist to Resources Build Phase for target #{target_name}"
  else
    puts "ℹ️ GoogleService-Info.plist is already in Resources Build Phase"
  end

  project.save
  puts "🚀 Project saved!"
else
  puts "❌ Could not find target #{target_name}"
end
