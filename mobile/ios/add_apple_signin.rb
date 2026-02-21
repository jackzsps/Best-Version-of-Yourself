require 'xcodeproj'

project_path = 'BestVersionOfYourself.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target_name = 'BestVersionOfYourself'
target = project.targets.find { |t| t.name == target_name }

if target.nil?
  puts "Error: Could not find target '#{target_name}'."
  exit 1
end

entitlements_path = 'BestVersionOfYourself/BestVersionOfYourself.entitlements'

# Add the file reference to the main group if it doesn't already exist
main_group = project.main_group.find_subpath('BestVersionOfYourself', true)
file_ref = main_group.files.find { |f| f.path == 'BestVersionOfYourself.entitlements' }

if file_ref.nil?
  file_ref = main_group.new_file('BestVersionOfYourself.entitlements')
  puts "Added #{entitlements_path} to Xcode project navigator."
else
  puts "#{entitlements_path} already exists in Xcode project navigator."
end

# Update Build Settings for all build configurations
target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = entitlements_path
  puts "Updated CODE_SIGN_ENTITLEMENTS for #{config.name} configuration."
end

project.save
puts "Successfully saved #{project_path}."
